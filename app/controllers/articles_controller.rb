class ArticlesController < ApplicationController

  # Naoufal: TODO: It is perhaps a good idea to add a toc action?!

  # Naoufal: TODO: Change the following line to load the layout dynamically
  #       depending on the template associated to the magissues
  layout "ts_test", :only => [:read, :preview]


  # GET /articles
  # GET /articles.json
  
 
  
  def index
    @articles = Article.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @articles }
    end
  end

  # GET /articles/1
  # GET /articles/1.json
  def show
    @article = Article.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @article }
    end
  end

  # GET /articles/new
  # GET /articles/new.json
  def new

    #Build the asset fields
    @article = Article.new
    # @magissues.assets.build


    #Orkun: maximum 3 pictures for each magissues. Returns 3 files, if there is
    #3.times (@magissues.assets.build)

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @article }
    end
  end

  # GET /articles/1/edit
  def edit
    @article = Article.find(params[:id])
    # @article.assets.build
    @videolinks = @article.videolinks.all
  end

  # POST /articles
  # POST /articles.json
  def create
    @article = Article.new(params[:article])

    respond_to do |format|
      if @article.save
        format.html { redirect_to @article, notice: 'Article was successfully created.' }
        format.json { render json: @article, status: :created, location: @article }
      else
        format.html { render action: "new", error: 'Article was not created.' }
        format.json { render json: @article.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /articles/1
  # PUT /articles/1.json
  def update
    @article = Article.find(params[:id])

    respond_to do |format|
      if @article.update_attributes(params[:article])
        format.html { redirect_to @article, notice: 'Article was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @article.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /articles/1
  # DELETE /articles/1.json
  def destroy
    @article = Article.find(params[:id])
    @article.destroy

    respond_to do |format|
      format.html { redirect_to articles_url }
      format.json { head :no_content }
    end
  end


  # Naoufal: Allow reading the selected magissues
  def read

    @article = Article.find(params[:id])
  end

  # Naoufal: Preview the article
  def preview
    @article = Article.find(params[:id])

    respond_to do |format|
      format.html # preview.html.erb
    end
  end
  
  # Naoufal: Un-assign a group of articles from the magazine issues, they were assigned to.
  def unassign
    Article.update_all(["magissue_id=?", nil], :id => params[:article_ids])
    @magazine = Magazine.find(params[:magazine])
    redirect_to assign_articles_magazine_path(@magazine)
  end

  def assign
    Article.update(params[:articles].keys, params[:articles].values)
    @magazine = Magazine.find(params[:magazine])
    redirect_to assign_articles_magazine_path(@magazine)
  end
end
